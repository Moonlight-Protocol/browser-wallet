import React from "react";

type Props = {
  children: React.ReactNode;
};

export function Container(props: Props) {
  return (
    <div className="w-full h-full p-5 flex flex-col overflow-hidden">
      {props.children}
    </div>
  );
}
