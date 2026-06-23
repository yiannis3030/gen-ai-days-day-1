import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookEntity } from './book.entity';
import { BooksRepository } from './books.repository';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookQueryDto } from './dto/book-query.dto';

@Injectable()
export class BooksService {
  constructor(private readonly booksRepository: BooksRepository) {}

  findAll(query: BookQueryDto): Promise<BookEntity[]> {
    return this.booksRepository.findAll(query);
  }

  async findOne(id: number): Promise<BookEntity> {
    const book = await this.booksRepository.findById(id);
    if (!book) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }
    return book;
  }

  async create(dto: CreateBookDto): Promise<BookEntity> {
    const existing = await this.booksRepository.findByIsbn(dto.isbn);
    if (existing) {
      throw new ConflictException(`Book with isbn ${dto.isbn} already exists`);
    }
    return this.booksRepository.create({ ...dto });
  }

  async update(id: number, dto: UpdateBookDto): Promise<BookEntity> {
    const book = await this.findOne(id);

    const isbnOwner = await this.booksRepository.findByIsbn(dto.isbn);
    if (isbnOwner && isbnOwner.id !== id) {
      throw new ConflictException(`Book with isbn ${dto.isbn} already exists`);
    }

    book.title = dto.title;
    book.authors = dto.authors;
    book.isbn = dto.isbn;
    book.publishedYear = dto.publishedYear;
    book.genre = dto.genre;

    return this.booksRepository.save(book);
  }

  async remove(id: number): Promise<void> {
    const book = await this.findOne(id);
    await this.booksRepository.remove(book);
  }
}

