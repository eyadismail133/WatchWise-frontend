import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../contracts/app-router";

export const trpc = createTRPCReact<AppRouter>();
