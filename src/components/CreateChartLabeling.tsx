import { useState } from "react"
import Dropdown from "./DropDown"
import Form from "./Form"
import { createChartLabeling } from "@/app/api/candles/fetch"

const CreateChartLabeling = () => {
  const [selectedData, setSelectedData] = useState({ key: "GBPJPY", value: "GBPJPY" })
  const [dropData, setDropData] = useState([{ key: "GBPJPY", value: "GBPJPY" }])

  const handleSelect = (event: any) => {
    setSelectedData(event.target.value)
  };
  const handleButton = async (e: any) => {
    const res = await createChartLabeling({
      name: text,
      pair: selectedData.value
    })
    localStorage.setItem("chart_id", res.id)
    console.log(res)
    window.alert(res)
  }

  const [text, setText] = useState("")

  return (
    <div className="m-5">
      <h1>CreateChartLabeling</h1>
      <Dropdown
        value={selectedData.value}
        options={dropData}
        onSelect={handleSelect}
      ></Dropdown>

      <h3>ラベルを付けるチャートの名前</h3>
      <Form text={text}
        handleText={(e: any) => {
          setText(e.target.value)
        }}
        handleButton={handleButton}
      ></Form>
    </div>
  )
}
export default CreateChartLabeling