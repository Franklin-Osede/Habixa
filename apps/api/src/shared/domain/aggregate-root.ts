import { Entity } from './entity';
import { UniqueEntityID } from './unique-entity-id';

// Domain Event interface for type safety
export interface DomainEvent {
  dateTimeOccurred: Date;
  getAggregateId(): UniqueEntityID;
}

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  constructor(props: T, id?: UniqueEntityID) {
    super(props, id);
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
    // Mark this aggregate for dispatch
    // DomainEvents.markAggregateForDispatch(this);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
