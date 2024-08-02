'use client'

import { BookmarkData } from "@/app/api/bookmark/route"
import { UTCTimestamp } from "lightweight-charts"
import UTCTimestampItem from "./UTCTimestampItem"

interface props {
  times: BookmarkData[]
}

const FindManyBookmarkView = (props: props) => {
  const handleTimestampClick = (timestamp: BookmarkData) => {
    alert(`Timestamp clicked: ${timestamp}`);
  };
  return (
    <div className="utc-timestamp-list">
      {props.times.map((timestamp, index) => (
        <UTCTimestampItem
          key={index}
          timestamp={timestamp}
          onClick={handleTimestampClick}
        />
      ))}
      <style jsx>{`
        .utc-timestamp-list {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
      `}</style>
    </div>
  )

}

export default FindManyBookmarkView