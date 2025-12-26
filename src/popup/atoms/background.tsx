import React from "react";

type Props = {
  children: React.ReactNode;
};

export function Background(props: Props) {
  return (
    <div className="relative bg-background min-w-[360px] h-[600px] overflow-hidden">
      {props.children}
    </div>
  );
}
