export type Mode = "PLAN" | "ACT";

const SYSTEM_PROMPTS: Record<Mode, string> = {
  PLAN: "You are a Software Architect. Analyze the request, think step-by-step, and create a detailed plan. Do NOT write code or call tools yet.",
  ACT: "You are a Senior Engineer. You have a plan. Now execute it using tools and code editing."
};

export class ModeManager {
  private currentMode: Mode = "ACT";

  getCurrent() {
    return this.currentMode;
  }

  toggle() {
    this.currentMode = this.currentMode === "ACT" ? "PLAN" : "ACT";
    return this.currentMode;
  }

  setCurrent(mode: Mode) {
    this.currentMode = mode;
  }

  getSystemPrompt() {
    return SYSTEM_PROMPTS[this.currentMode];
  }
}

export const modeManager = new ModeManager();
