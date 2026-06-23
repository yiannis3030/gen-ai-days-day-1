import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookEntity } from './book.entity';
import { BookQueryDto } from './dto/book-query.dto';

@Injectable()
export class BooksRepository {
  constructor(
    @InjectRepository(BookEntity)
    private readonly repository: Repository<BookEntity>,
  ) {}

  findAll(filter: BookQueryDto): Promise<BookEntity[]> {
    const qb = this.repository.createQueryBuilder('book');
    if (filter.genre) {
      qb.andWhere('book.genre = :genre', { genre: filter.genre });
    }
    if (filter.author) {
      qb.andWhere('book.authors LIKE :author', {
        author: `%${filter.author}%`,
      });
    }
    return qb.getMany();
  }

  findById(id: number): Promise<BookEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByIsbn(isbn: string): Promise<BookEntity | null> {
    return this.repository.findOne({ where: { isbn } });
  }

  findByAuthor(name: string): Promise<BookEntity[]> {
    return this.repository
      .createQueryBuilder('book')
      .where('book.authors LIKE :name', { name: `%${name}%` })
      .getMany();
  }

  create(data: Partial<BookEntity>): Promise<BookEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  save(entity: BookEntity): Promise<BookEntity> {
    return this.repository.save(entity);
  }

  async remove(entity: BookEntity): Promise<void> {
    await this.repository.remove(entity);
  }
}

