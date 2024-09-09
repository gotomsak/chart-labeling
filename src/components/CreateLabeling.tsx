import { labelingCreate } from "@/app/api/candles/labeling/create/fetch"
import Dropdown from "./DropDown"
import Form from "./Form"
import { useState } from "react"


const CreateLabeling = () => {
  const [selectedData, setSelectedData] = useState({ key: "GBPJPY", value: "GBPJPY" })
  const [dropData, setDropData] = useState([{ key: "GBPJPY", value: "GBPJPY" }])
  const [text, setText] = useState("")

  const handleSelect = (event: any) => {
    setSelectedData(event.target.value)
  };
  const handleButton = async (e: any) => {
    const res:any = await labelingCreate({
      labelingName: text,
      pair: selectedData.value
    })
    localStorage.setItem("labeling_id", res.insertedId)
    console.log(res)
    window.alert(res)
  }


  return (
    <div className="m-5">
      <h1>CreateLabeling</h1>
      <Dropdown
        value={selectedData.value}
        options={dropData}
        onSelect={handleSelect}
      ></Dropdown>

      <h3>ラベルの名前</h3>
      <Form text={text}
        handleText={(e: any) => {
          setText(e.target.value)
        }}
        handleButton={handleButton}
      ></Form>
    </div>
  )
}

export default CreateLabeling