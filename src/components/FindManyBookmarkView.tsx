"use client";

import type { BookmarkData } from "@/app/api/bookmark/route";
import UTCTimestampItem from "./UTCTimestampItem";

interface props {
  times: BookmarkData[];
}

const FindManyBookmarkView = (props: props) => {
  const handleTimestampClick = (timestamp: BookmarkData) => {
    alert(`Timestamp clicked: ${timestamp.time}`);
  };
  return (
    <div className="utc-timestamp-list">
      {props.times.map((timestamp, index) => (
        <UTCTimestampItem key={index} timestamp={timestamp} onClick={handleTimestampClick} />
      ))}
      <style jsx>{`
        .utc-timestamp-list {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
      `}</style>
    </div>
  );
};

export default FindManyBookmarkView;
