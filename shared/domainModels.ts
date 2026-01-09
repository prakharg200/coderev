/**
 * Domain specific model types built off of the base model types.
 */

import { Archivable, EmbeddedRef, Entity, MediaRef } from "./models";

/**
 * Defines the role types for the users on the workspace.
 */
export type CollaboratorRole = "owner" | "editor" | "reviewer";

/**
 * This type is used to model invites which include a pending property to indicate
 * that the invitation has not yet been accepted.
 */
export type CollaboratorRef = EmbeddedRef & {
  /**
   * When this is true, the collaborator has only been invited and has not yet
   * joined the trip.
   */
  pending: boolean;

  /**
   * The role for the collaborator
   */
  role: CollaboratorRole;
};

/**
 * An embedded type on the workspace that represents ratings and notes for a given
 * candidate.
 */
export type Rating = {
  /**
   * A numeric score of the candidate's submission
   */
  overall: number,
  /**
   * How deep the candidate's submissions were
   */
  depth?: number,
  /**
   * How clearly the candidate communicated
   */
  clarity?: number,
  /**
   * How thorough the candidate was overall
   */
  thoroughness?: number,
  /**
   * Comments entered by a user creating the rating.
   */
  comments: string,
  /**
   * The author of the rating including the `addedUtc`
   */
  author: EmbeddedRef
}

/**
 * Represents a coding problem created by an interviewer.
 */
export type CodingProblem = {
  /**
   * Unique identifier for this problem
   */
  uid: string;

  /**
   * Title of the problem
   */
  title: string;

  /**
   * Problem description in markdown format
   */
  description: string;

  /**
   * Optional starter code for the problem
   */
  starterCode?: string;

  /**
   * Programming language for the starter code
   */
  language?: string;

  /**
   * When this problem was created
   */
  createdUtc: string;

  /**
   * UID of the user who created this problem
   */
  createdBy: string;
};

/**
 * Represents a candidate's submission for a coding problem.
 */
export type ProblemSubmission = {
  /**
   * Unique identifier for this submission
   */
  uid: string;

  /**
   * UID of the problem this submission is for
   */
  problemUid: string;

  /**
   * UID of the candidate who submitted this
   */
  candidateUid: string;

  /**
   * The submitted code
   */
  code: string;

  /**
   * When this was submitted
   */
  submittedUtc: string;

  /**
   * Status of the submission
   */
  status: 'pending' | 'reviewed';

  /**
   * Optional feedback from the interviewer
   */
  feedback?: string;

  /**
   * Rating from 1-5 given by interviewer
   */
  rating?: number;
};

/**
 * Defines a workspace which contains a set of notes.
 */
export type Workspace = {
  /**
   * A description for the workspace
   */
  description?: string;

  /**
   * The collaborators who have created accounts to work on this trip.  The refs
   * point to user profiles.  The key is the UID.  This will always contain
   * the user who created the trip.
   */
  collaborators: Record<string, CollaboratorRef>;

  /**
   * Represents a set of content which every workspace is associated with.  A content
   * set can be associated with multiple workspaces.  For example, a set of documents
   * can be shared by multiple teams in different workspaces.
   */
  sources: Record<string, MediaRef>;

  /**
   * A record which holds the ratings for a given candidate.  The key is the
   * candidate UID and there can be an array of ratings.
   */
  ratings?: Record<string, Rating>;

  /**
   * Coding problems created for this workspace. Key is problem UID.
   */
  problems?: Record<string, CodingProblem>;
} & Entity & Archivable;

/**
 * The context type of a comment so we know what the comment is attached to.
 */
export type ContextType =
  | "source"
  | "comment"

/**
 * Defines a comment
 */
export type ReviewComment = {
  /**
   * A UID for this comment used for updates and deletion.
   */
  uid: string;

  /**
   * The body of the comment.
   */
  text: string

  /**
   * Represents a range in the source that the comment is referencing.
   */
  sourceRange?: number[]

  /**
   * Determines the type of context for this comment.
   */
  contextType: ContextType

  /**
   * The UID of the context which references either a source file or another comment.
   */
  contextUid: string

  /**
   * The reference to the author of the comment and also includes the timestamp.
   */
  author: EmbeddedRef
}

/**
 * Represents an edit made by a candidate to an existing source file.
 */
export type CandidateEdit = {
  /**
   * UID of the original source file that was edited
   */
  originalSourceUid: string;

  /**
   * The modified text content
   */
  modifiedText: string;

  /**
   * When this edit was last modified
   */
  lastModifiedUtc: string;
};

/**
 * Represents a new file created by a candidate.
 */
export type CandidateNewFile = {
  /**
   * UID for this new file
   */
  uid: string;

  /**
   * Name of the file (with extension)
   */
  name: string;

  /**
   * Content of the file
   */
  content: string;

  /**
   * When this file was created
   */
  createdUtc: string;

  /**
   * When this file was last modified
   */
  lastModifiedUtc?: string;
};

/**
 * This document represents a candidate review.  When we create it, we copy over
 * the media refs from the workspace.
 */
export type CandidateReview = {
  /**
   * The UID of the workspace that is referenced by this review.
   */
  workspaceUid: string;

  /**
   * Copy this value so we don't need to have permissions to read the workspace.
   */
  workspaceName: string;

  /**
   * The email address of the candidate that this review is assigned to.
   */
  email: string;

  /**
   * If the user selects to create an anonymous account, then we want to allow
   * entry of a label here.
   */
  label?: string;

  /**
   * Represents a set of content which every workspace is associated with.  A content
   * set can be associated with multiple workspaces.  For example, a set of documents
   * can be shared by multiple teams in different workspaces.
   */
  sources: Record<string, MediaRef>;

  /**
   * The comments attached to this review.  The key is a unique ID for the
   * comment.
   */
  comments: Record<string, ReviewComment>;

  /**
   * Edits made by the candidate to existing source files.
   * Key is the source UID.
   */
  candidateEdits?: Record<string, CandidateEdit>;

  /**
   * New files created by the candidate.
   * Key is the file UID.
   */
  candidateNewFiles?: Record<string, CandidateNewFile>;

  /**
   * Problem submissions by the candidate.
   * Key is the problem UID.
   */
  problemSubmissions?: Record<string, ProblemSubmission>;
} & Entity & Archivable;
