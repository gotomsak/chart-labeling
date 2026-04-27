import { useState } from "react";
import { labelingCreate } from "@/app/api/candles/labeling/create/fetch";
import Form from "./Form";

interface Props {
  symbol: string;
}

const CreateLabeling = ({ symbol }: Props) => {
  const [text, setText] = useState("");

  const handleButton = async (_e: React.MouseEvent<HTMLButtonElement>) => {
    if (!text) {
      window.alert("ラベル名を入力してください");
      return;
    }
    const res = await labelingCreate({
      labelingName: text,
      pair: symbol,
    });
    if (res?.data?.id != null) {
      localStorage.setItem("labeling_id", String(res.data.id));
      window.alert("labelを切り替えます");
      window.location.reload();
    } else {
      window.alert(
        "ラベルの作成に失敗しました（チャートデータが投入されているか確認してください）",
      );
    }
  };

  return (
    <div className="m-5">
      <h1>CreateLabeling ({symbol})</h1>
      <h3>ラベルの名前</h3>
      <Form
        text={text}
        handleText={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
        handleButton={handleButton}
      />
    </div>
  );
};

export default CreateLabeling;
