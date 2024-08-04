import { useState } from 'react';


interface props{
  text: string
  handleText: (e:any)=>void
  handleButton: (e:any)=>void
}
const Form = (props: props) => {
  return (
    <div className="flex flex-col items-center justify-center ">
      <input
        type="text"
        value={props.text}
        onChange={props.handleText}
        className="p-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="テキストを入力してください"
      />
      <button
        onClick={props.handleButton}
        className="px-4 py-2 font-semibold text-white bg-blue-500 rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        送信
      </button>
    </div>
  );
};

export default Form;
