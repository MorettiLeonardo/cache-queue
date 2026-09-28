import {
  AnswerParticipationResponseDTO,
  ParticipationSummaryDTO
} from '../dto/ParticipationDTO.types.js';
import type { ReportedParticipationStatus } from '../cache/ParticipationCache.types.js';
import { ParticipationStatus } from '../entities/Participation.types.js';

export interface StartParticipationParams {
  user_id: number;
}

export interface StartParticipationResult {
  participation_id: number;
  user_id: number;
  status: ParticipationStatus.IN_PROGRESS;
  started_at: string;
}

export interface AnswerParticipationParams {
  participation_id: number;
  question_id: number;
  selected_option_id: number;
}

export interface AnswerParticipationResult extends AnswerParticipationResponseDTO { }

export interface FinishParticipationParams {
  participation_id: number;
}

export interface FinishParticipationResult {
  participation_id: number;
  status: ReportedParticipationStatus;
  queued_answers: number;
  enqueued: boolean;
}

export interface GetParticipationParams {
  id: number;
}

export interface GetParticipationResult {
  summary: ParticipationSummaryDTO;
}
