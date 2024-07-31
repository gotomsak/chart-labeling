    // const formattedData = data.map((item:any) => {
    //   // 'yyyy-mm-dd hh:mm'形式の日付をUNIXタイムスタンプに変換する
    //   // 元データをUNIXタイムにする修正が必要
    //   // const [date, time] = item.time.split(' ');
    //   // const [year, month, day] = date.split('-').map(Number);
    //   // const [hours, minutes] = time.split(':').map(Number);
    //   // const dateObj = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    //   return {
    //     // time: dateObj.getTime() / 1000,
    //     time: item.time,
    //     open: item.open,
    //     high: item.high,
    //     low: item.low,
    //     close: item.close,
    //   };
    // });