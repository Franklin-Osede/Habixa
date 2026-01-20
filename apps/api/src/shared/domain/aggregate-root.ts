import { Entity } from './entity';
import { UniqueEntityID } from './unique-entity-id';

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: any[] = []; // We will implement DomainEvent later

  // ...

  /* eslint-disable @typescript-eslint/no-unsafe-return */
  get domainEvents(): any[] {
    return this._domainEvents;
  }
  /* eslint-enable @typescript-eslint/no-unsafe-return */

  constructor(props: T, id?: UniqueEntityID) {
    super(props, id);
  }

  protected addDomainEvent(domainEvent: any): void {
    this._domainEvents.push(domainEvent);
    // Mark this aggregate for dispatch
    // DomainEvents.markAggregateForDispatch(this);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
