import { Entity } from './entity';

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: any[] = []; // We will implement DomainEvent later

  // ...
  
  get domainEvents(): any[] {
    return this._domainEvents;
  }

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(props: T, id?: any) {
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
