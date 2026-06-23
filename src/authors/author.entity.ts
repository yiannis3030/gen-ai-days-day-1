import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BookEntity } from '../books/book.entity';

@Entity('authors')
export class AuthorEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality?: string;

  @Column({ type: 'integer', nullable: true })
  birthYear?: number;

  /** Virtual field – populated by the service, not persisted as a DB column. */
  books?: BookEntity[];
}
