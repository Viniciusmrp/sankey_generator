export interface SankeyData {
  nodes: string[];
  links: {
    source: number;
    target: number;
    value: number;
  }[];
} 