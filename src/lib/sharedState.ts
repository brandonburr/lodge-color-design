import { ColorSelection } from "./colors";

export interface DesignComment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface SharedDesign {
  id: string;
  name: string;
  colors: ColorSelection;
  createdBy: string;
  createdAt: number;
  thumbsUp: string[];   // usernames who voted
  comments: DesignComment[];
}

export interface SharedState {
  designs: SharedDesign[];
}
