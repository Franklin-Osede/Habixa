import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { Result } from '../../../shared/domain/result';

export type SnippetSource = 'manual' | 'url' | 'file';

interface KnowledgeSnippetProps {
  userId: UniqueEntityID;
  content: string;
  tags: string[];
  source: SnippetSource;
  createdAt?: Date;
}

export class KnowledgeSnippet extends AggregateRoot<KnowledgeSnippetProps> {
  // Explicitly declare props to satisfy TS if base class inference fails
  public readonly props: KnowledgeSnippetProps;

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get content(): string {
    return this.props.content;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get source(): SnippetSource {
    return this.props.source;
  }

  // id getter is inherited from Entity base class now

  private constructor(props: KnowledgeSnippetProps, id?: UniqueEntityID) {
    super(props, id);
    this.props = props;
  }

  public static create(
    props: KnowledgeSnippetProps,
    id?: UniqueEntityID,
  ): Result<KnowledgeSnippet> {
    if (!props.content || props.content.length === 0) {
      return Result.fail('Content cannot be empty');
    }
    return Result.ok<KnowledgeSnippet>(new KnowledgeSnippet(props, id));
  }
}
