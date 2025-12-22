import React from "react";
import { Background } from "../atoms/background.tsx";
import { Container } from "../atoms/container.tsx";
import { DEV } from "@/common/dev-flag.ts";
import { DevDebug } from "@/popup/organisms/dev-debug.tsx";

export function Shell(props: { children: React.ReactNode }) {
  return (
    <Background>
      <Container>
        <div className="flex-1 overflow-y-auto">{props.children}</div>
        {DEV ? <DevDebug /> : null}
      </Container>
    </Background>
  );
}
