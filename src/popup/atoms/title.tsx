import React from "react";

type Props = {
  children: React.ReactNode;
};

export function Title(props: Props) {
  return (
    <h1 className="text-lg font-light tracking-wide text-primary">
      {props.children}
    </h1>
  );
}
