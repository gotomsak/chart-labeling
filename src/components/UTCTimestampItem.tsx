import { BookmarkData } from '@/app/api/bookmark/route';
import { Time, UTCTimestamp } from 'lightweight-charts';
import React from 'react';

interface Props {
  timestamp: BookmarkData;
  onClick: (timestamp: BookmarkData) => void;
}

const UTCTimestampItem: React.FC<Props> = ({ timestamp, onClick }) => {
  
  const handleClick = () => {
    onClick(timestamp);
  };

  return (
    <div className="utc-timestamp-item" onClick={handleClick}>
      {timestamp.time.toString()}
      <style jsx>{`
        .utc-timestamp-item {
          cursor: pointer;
          padding: 10px;
          border: 1px solid #ccc;
          margin: 5px;
          border-radius: 5px;
          transition: background-color 0.3s;
        }
        .utc-timestamp-item:hover {
          background-color: #f0f0f0;
        }
      `}</style>
    </div>
  );
};

export default UTCTimestampItem;
