import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('books')
export class BookEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'simple-array' })
  authors!: string[];

  @Column({ type: 'varchar', unique: true })
  isbn!: string;

  @Column({ type: 'integer' })
  publishedYear!: number;

  @Column({ type: 'varchar', nullable: true })
  genre?: string;
}

