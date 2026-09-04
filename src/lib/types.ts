export type Phase = "question1" | "question2";

export type TheoryId =
  | "carga-cognitiva"
  | "zdp"
  | "reforco-variavel";

export interface Response {
  id: string;
  color: string;
  question1: string;
  question2?: string;
  theoryId?: TheoryId;
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  phase: Phase;
  revision: number;
  responses: Response[];
}

export interface PublicState {
  phase: Phase;
  revision: number;
  responses: Array<{
    id: string;
    color: string;
    question1: string;
    question2?: string;
    theoryId?: TheoryId;
  }>;
  counts: {
    question1: number;
    question2: number;
  };
  persistence?: "redis" | "memory";
}
