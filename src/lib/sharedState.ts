import { ColorSelection } from "./colors";

export interface DesignComment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface SharedDesign {
  id: string;
  /**
   * Optional human-given name. Older entries (created before the gallery
   * dropped the manual name field) will have this populated; new entries
   * leave it undefined and the UI labels the design with its color names
   * instead.
   */
  name?: string;
  colors: ColorSelection;
  createdBy: string;
  createdAt: number;
  thumbsUp: string[];   // usernames who voted
  comments: DesignComment[];
}

export interface SharedState {
  designs: SharedDesign[];
}
