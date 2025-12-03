export interface GoalMember {
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'member';
  joinedAt: Date;
}

export interface GoalInvite {
  email: string;
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface GoalProgressHistory {
  amount: number;
  addedBy: string;
  addedByName: string;
  date: Date;
}