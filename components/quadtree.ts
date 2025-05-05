// Quadtree implementation for efficient particle management

// Rectangle class to define boundaries
export class Rectangle {
  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number
  ) {}

  // Check if this rectangle contains a point
  contains(point: { x: number; y: number }): boolean {
    return (
      point.x >= this.x - this.w &&
      point.x <= this.x + this.w &&
      point.y >= this.y - this.h &&
      point.y <= this.y + this.h
    );
  }

  // Check if this rectangle intersects another rectangle
  intersects(range: Rectangle): boolean {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h
    );
  }
}

// Quadtree class
export class QuadTree<T extends { x: number; y: number }> {
  private capacity: number;
  private boundary: Rectangle;
  private points: T[] = [];
  private divided: boolean = false;
  private northeast: QuadTree<T> | null = null;
  private northwest: QuadTree<T> | null = null;
  private southeast: QuadTree<T> | null = null;
  private southwest: QuadTree<T> | null = null;

  constructor(boundary: Rectangle, capacity: number = 4) {
    this.boundary = boundary;
    this.capacity = capacity;
  }

  // Subdivide this quadtree into four equal quadrants
  subdivide(): void {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const w = this.boundary.w / 2;
    const h = this.boundary.h / 2;

    const ne = new Rectangle(x + w, y - h, w, h);
    const nw = new Rectangle(x - w, y - h, w, h);
    const se = new Rectangle(x + w, y + h, w, h);
    const sw = new Rectangle(x - w, y + h, w, h);

    this.northeast = new QuadTree<T>(ne, this.capacity);
    this.northwest = new QuadTree<T>(nw, this.capacity);
    this.southeast = new QuadTree<T>(se, this.capacity);
    this.southwest = new QuadTree<T>(sw, this.capacity);

    this.divided = true;

    // Redistribute existing points to children
    for (const point of this.points) {
      this.insertToChildren(point);
    }
    this.points = []; // Clear points from this node
  }

  // Insert a point to children after subdivision
  private insertToChildren(point: T): boolean {
    if (this.northeast!.insert(point)) return true;
    if (this.northwest!.insert(point)) return true;
    if (this.southeast!.insert(point)) return true;
    if (this.southwest!.insert(point)) return true;
    
    return false; // Should never reach here if boundary checks are correct
  }

  // Insert a point into the quadtree
  insert(point: T): boolean {
    // Check if point is within boundary
    if (!this.boundary.contains(point)) {
      return false;
    }

    // If space available, add the point
    if (this.points.length < this.capacity && !this.divided) {
      this.points.push(point);
      return true;
    }

    // Otherwise, subdivide and then add the point
    if (!this.divided) {
      this.subdivide();
    }

    return this.insertToChildren(point);
  }

  // Query all points within a range
  query(range: Rectangle, found: T[] = []): T[] {
    if (!this.boundary.intersects(range)) {
      return found;
    }

    // Check points at this level
    for (const point of this.points) {
      if (range.contains(point)) {
        found.push(point);
      }
    }

    // Check children if divided
    if (this.divided) {
      this.northeast!.query(range, found);
      this.northwest!.query(range, found);
      this.southeast!.query(range, found);
      this.southwest!.query(range, found);
    }

    return found;
  }

  // Clear all points from the quadtree
  clear(): void {
    this.points = [];
    this.divided = false;
    this.northeast = null;
    this.northwest = null;
    this.southeast = null;
    this.southwest = null;
  }

  // Get all points in the quadtree (for debugging)
  getAllPoints(): T[] {
    const allPoints: T[] = [...this.points];
    
    if (this.divided) {
      allPoints.push(...this.northeast!.getAllPoints());
      allPoints.push(...this.northwest!.getAllPoints());
      allPoints.push(...this.southeast!.getAllPoints());
      allPoints.push(...this.southwest!.getAllPoints());
    }
    
    return allPoints;
  }
} 