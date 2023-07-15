export type Item<T> = T | null;
export class RingBuffer<T> {
  private data: Array<Item<T>>;
  private head = 0;
  private tail = 0;
  private readonly size: number;

  constructor(size: number) {
    this.data = Array<Item<T>>();
    this.size = size;
  }

  public enqueue(item: Item<T>): void {
    if (this.isFull()) {
      this.dequeue();
    }
    this.data[this.tail] = item;
    this.tail = (this.tail + 1) % this.size;
  }

  public dequeue(): Item<T> {
    if (this.isEmpty()) {
      return null;
    }
    const item = this.data[this.head];
    this.data[this.head] = null;
    this.head = (this.head + 1) % this.size;
    return item;
  }

  public peek(): Item<T> {
    if (this.isEmpty()) {
      return null;
    }
    return this.data[this.head];
  }

  public isFull(): boolean {
    return (this.tail + 1) % this.size === this.head;
  }

  public isEmpty(): boolean {
    return this.head === this.tail;
  }

  public getSize(): number {
    return this.size;
  }

  public toArray(): Array<Item<T>> {
    const result = Array<Item<T>>();
    for (let i = this.head; i !== this.tail; i = (i + 1) % this.size) {
      result.push(this.data[i]);
    }
    return result;
  }
}
