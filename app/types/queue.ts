export interface Player {
  id: string;
  username: string;
  platformId: string;
  mmr: number;
  wins: number;
  losses: number;
}

export interface Queue {
  id: string;
  players: Player[];
  status: "waiting" | "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  blueTeam: Player[];
  orangeTeam: Player[];
  winner?: "blue" | "orange";
  createdAt: Date;
  completedAt?: Date;
}
