import React from "react";
import { ActivityLog } from "../types";
import { formatDate } from "../utils/storage";
import "../styles/ActivityPanel.css";

interface ActivityPanelProps {
  activities: ActivityLog[];
  onClear: () => void;
}

export const ActivityPanel: React.FC<ActivityPanelProps> = ({
  activities,
  onClear,
}) => {
  return (
    <div className="activity-panel" id="activityPanel">
      <div className="activity-header">
        <h3>⚡ Atividade Recente</h3>
        {activities.length > 0 && (
          <button onClick={onClear} className="btn-small btn-danger">
            Limpar
          </button>
        )}
      </div>

      <div className="activity-list">
        {activities.length === 0 ? (
          <p className="empty-message">Nenhuma atividade registrada ainda</p>
        ) : (
          [...activities]
            .reverse()
            .slice(0, 50)
            .map((activity) => (
              <div key={activity.id} className="activity-item">
                <div>
                  <span className="activity-user">{activity.userName}</span>
                  <span className="activity-action">{activity.action}</span>
                </div>
                <span className="activity-time">
                  {formatDate(activity.timestamp)}
                </span>
              </div>
            ))
        )}
      </div>
    </div>
  );
};
