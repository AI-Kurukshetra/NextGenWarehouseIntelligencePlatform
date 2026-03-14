import { updateRecord } from "@/modules/core/repository";
import { writeAuditLog } from "@/modules/core/audit";

type AssignTaskPayload = {
  taskId: string;
  workerId: string;
  performedBy?: string;
};

export async function assignTask(payload: AssignTaskPayload) {
  const task = await updateRecord("tasks", payload.taskId, {
    assigned_worker: payload.workerId,
    status: "assigned",
  });

  await writeAuditLog({
    action: "tasks.assigned",
    entity_type: "tasks",
    entity_id: payload.taskId,
    performed_by: payload.performedBy,
    metadata: {
      workerId: payload.workerId,
    },
  });

  return task;
}
