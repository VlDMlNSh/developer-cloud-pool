const SAFE_TASK_KEY = /^[a-f0-9]{64}$/;
const ARTIFACT_KEY = /^ingest\/([a-f0-9]{64})\/([A-Za-z0-9_-]{16,128})$/;
const MAX_PAGE_LIMIT = 1000;
const MAX_PAGES = 100;
const MAX_OBJECTS = 10000;
const MAX_D1_ROWS = 3000;

function incomplete(reason, state = {}) {
  return {
    decision: "INVENTORY_INCOMPLETE",
    objectListingComplete: false,
    referenceSnapshotComplete: false,
    crossStoreSnapshotConsistent: false,
    deletionPermitted: false,
    reasons: [reason],
    objects: [],
    resultReferences: [],
    outboxReferences: [],
    tasks: [],
    ...state
  };
}

function validOptions(options) {
  return options && Number.isSafeInteger(options.pageLimit) &&
    options.pageLimit >= 1 && options.pageLimit <= MAX_PAGE_LIMIT &&
    Number.isSafeInteger(options.maxPages) && options.maxPages >= 1 &&
    options.maxPages <= MAX_PAGES &&
    Number.isSafeInteger(options.maxObjects) && options.maxObjects >= 1 &&
    options.maxObjects <= MAX_OBJECTS &&
    Number.isSafeInteger(options.maxD1Rows) && options.maxD1Rows >= 1 &&
    options.maxD1Rows <= MAX_D1_ROWS;
}

/**
 * Reads R2 object pages and one bounded D1 reference/task statement.
 * It never writes, mutates, or deletes. The two stores are not a shared
 * transactional snapshot; callers must keep deletion disabled.
 */
export async function collectArtifactInventory(bucket, db, options = {}) {
  const config = {
    prefix: "ingest/",
    pageLimit: 500,
    maxPages: 10,
    maxObjects: 5000,
    maxD1Rows: 2500,
    ...options
  };
  if (!bucket || typeof bucket.list !== "function" ||
      !db || typeof db.prepare !== "function" || !validOptions(config) ||
      config.prefix !== "ingest/") {
    return incomplete("INVALID_INVENTORY_CONFIGURATION");
  }

  const objects = [];
  const seenKeys = new Set();
  const seenCursors = new Set();
  const reasons = [];
  let cursor;
  let pagesRequested = 0;
  let objectListingComplete = false;

  for (let pageNumber = 0; pageNumber < config.maxPages; pageNumber += 1) {
    let page;
    pagesRequested += 1;
    try {
      page = await bucket.list({
        prefix: config.prefix,
        limit: config.pageLimit,
        include: ["customMetadata"],
        ...(cursor ? { cursor } : {})
      });
    } catch {
      reasons.push("R2_LIST_REQUEST_FAILED");
      break;
    }

    if (!page || !Array.isArray(page.objects) || typeof page.truncated !== "boolean") {
      reasons.push("R2_LIST_RESPONSE_INVALID");
      break;
    }

    for (const object of page.objects) {
      if (!object || typeof object.key !== "string" || typeof object.version !== "string" ||
          !object.version || !(object.uploaded instanceof Date) ||
          !Number.isFinite(object.uploaded.getTime())) {
        reasons.push("R2_OBJECT_METADATA_INVALID");
        continue;
      }
      if (seenKeys.has(object.key)) {
        reasons.push("R2_DUPLICATE_OBJECT_KEY_ACROSS_PAGES");
        continue;
      }
      if (objects.length >= config.maxObjects) {
        reasons.push("R2_OBJECT_LIMIT_REACHED");
        break;
      }
      seenKeys.add(object.key);
      objects.push({
        key: object.key,
        version: object.version,
        size: Number.isSafeInteger(object.size) && object.size >= 0 ? object.size : null,
        uploaded: object.uploaded.toISOString(),
        customMetadata: object.customMetadata && typeof object.customMetadata === "object"
          ? { ...object.customMetadata }
          : {}
      });
    }

    if (reasons.includes("R2_OBJECT_LIMIT_REACHED") ||
        reasons.includes("R2_OBJECT_METADATA_INVALID") ||
        reasons.includes("R2_DUPLICATE_OBJECT_KEY_ACROSS_PAGES")) break;

    if (!page.truncated) {
      objectListingComplete = true;
      break;
    }
    if (typeof page.cursor !== "string" || page.cursor.length === 0 ||
        seenCursors.has(page.cursor)) {
      reasons.push("R2_CURSOR_MISSING_OR_REPEATED");
      break;
    }
    seenCursors.add(page.cursor);
    cursor = page.cursor;
  }

  if (!objectListingComplete && reasons.length === 0) reasons.push("R2_PAGE_LIMIT_REACHED");

  const taskKeys = [...new Set(objects.map((object) => {
    const match = ARTIFACT_KEY.exec(object.key);
    return match && SAFE_TASK_KEY.test(match[1]) ? match[1] : null;
  }).filter(Boolean))];

  let referenceSnapshotComplete = false;
  const resultReferences = [];
  const outboxReferences = [];
  const tasks = [];

  try {
    const sql = `
      WITH requested(task_key) AS (
        SELECT CAST(value AS TEXT) FROM json_each(?)
      ),
      records AS (
        SELECT 'result' AS record_type, task_key,
               artifact_object_key AS object_key,
               artifact_object_version AS object_version,
               NULL AS task_state
          FROM pool_task_results
        UNION ALL
        SELECT 'outbox' AS record_type, task_key,
               artifact_object_key AS object_key,
               artifact_object_version AS object_version,
               NULL AS task_state
          FROM pool_task_result_outbox
        UNION ALL
        SELECT 'task' AS record_type, requested.task_key,
               NULL AS object_key, NULL AS object_version,
               pool_tasks.state AS task_state
          FROM requested LEFT JOIN pool_tasks
            ON pool_tasks.task_key = requested.task_key
      )
      SELECT record_type, task_key, object_key, object_version, task_state
        FROM records
       LIMIT ?
    `;
    const query = await db.prepare(sql)
      .bind(JSON.stringify(taskKeys), config.maxD1Rows + 1)
      .all();
    if (!query || query.success !== true || !Array.isArray(query.results)) {
      reasons.push("D1_REFERENCE_QUERY_FAILED");
    } else if (query.results.length > config.maxD1Rows) {
      reasons.push("D1_REFERENCE_ROW_LIMIT_REACHED");
    } else {
      for (const row of query.results) {
        if (row.record_type === "result" || row.record_type === "outbox") {
          if (typeof row.object_key !== "string" || !row.object_key ||
              typeof row.object_version !== "string" || !row.object_version) {
            reasons.push("D1_REFERENCE_IDENTITY_INVALID");
            break;
          }
          const reference = {
            objectKey: row.object_key,
            objectVersion: row.object_version,
            taskKey: row.task_key
          };
          (row.record_type === "result" ? resultReferences : outboxReferences).push(reference);
        } else if (row.record_type === "task") {
          if (row.task_state === null) continue;
          if (!SAFE_TASK_KEY.test(row.task_key ?? "") ||
              !["pending", "leased", "completed", "dead"].includes(row.task_state)) {
            reasons.push("D1_TASK_STATE_INVALID");
            break;
          }
          tasks.push({ taskKey: row.task_key, state: row.task_state });
        } else {
          reasons.push("D1_RECORD_TYPE_INVALID");
          break;
        }
      }
      if (!reasons.some((reason) => reason.startsWith("D1_"))) {
        referenceSnapshotComplete = true;
      }
    }
  } catch {
    reasons.push("D1_REFERENCE_QUERY_FAILED");
  }

  const complete = objectListingComplete && referenceSnapshotComplete && reasons.length === 0;
  return {
    decision: complete ? "INVENTORY_COMPLETE" : "INVENTORY_INCOMPLETE",
    objectListingComplete,
    referenceSnapshotComplete,
    crossStoreSnapshotConsistent: false,
    deletionPermitted: false,
    reasons,
    objects,
    resultReferences,
    outboxReferences,
    tasks,
    counts: {
      objects: objects.length,
      resultReferences: resultReferences.length,
      outboxReferences: outboxReferences.length,
      tasks: tasks.length,
      pagesRequested
    }
  };
}
