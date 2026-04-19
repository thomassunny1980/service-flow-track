import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ServiceStatus =
  | "received"
  | "in_progress"
  | "awaiting_parts"
  | "completed"
  | "external_service"
  | "ready_for_pickup"
  | "delivered";

interface StatusBadgeProps {
  status: ServiceStatus;
  className?: string;
}

const statusConfig: Record<ServiceStatus, { label: string; className: string }> = {
  received: {
    label: "Received",
    className: "bg-status-received/10 text-status-received border-status-received/20",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-status-inProgress/10 text-status-inProgress border-status-inProgress/20",
  },
  awaiting_parts: {
    label: "Awaiting Parts",
    className: "bg-status-awaitingParts/10 text-status-awaitingParts border-status-awaitingParts/20",
  },
  completed: {
    label: "Completed",
    className: "bg-status-completed/10 text-status-completed border-status-completed/20",
  },
  external_service: {
    label: "External Service",
    className: "bg-status-external/10 text-status-external border-status-external/20",
  },
  ready_for_pickup: {
    label: "Ready for Pickup",
    className: "bg-status-ready/10 text-status-ready border-status-ready/20",
  },
  delivered: {
    label: "Delivered",
    className: "bg-status-delivered/10 text-status-delivered border-status-delivered/20",
  },
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn("font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
