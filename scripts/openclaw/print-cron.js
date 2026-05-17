#!/usr/bin/env node
import { buildCronEntries, DEFAULT_MISSION_CONTROL_ROOT } from "./automation-lib.js";

console.log(buildCronEntries(process.env.MISSION_CONTROL_ROOT ?? DEFAULT_MISSION_CONTROL_ROOT));
