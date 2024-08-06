interface props {
  onClick: () => void;
  text: string;
}

const Button = (props: props) => {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      onClick={props.onClick}>{props.text}
    </button>
  );
}

export default Button;