import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthorEntity } from './author.entity';
import { AuthorsRepository } from './authors.repository';
import { CreateAuthorDto } from './dto/create-author.dto';
import { BookEntity } from '../books/book.entity';
import { BooksRepository } from '../books/books.repository';

@Injectable()
export class AuthorsService {
  constructor(
    private readonly authorsRepository: AuthorsRepository,
    private readonly booksRepository: BooksRepository,
  ) {}

  async findAll(): Promise<AuthorEntity[]> {
    const authors = await this.authorsRepository.findAll();
    return Promise.all(
      authors.map(async (author) => {
        author.books = await this.booksRepository.findByAuthor(author.name);
        return author;
      }),
    );
  }

  async findOne(id: number): Promise<AuthorEntity> {
    const author = await this.authorsRepository.findById(id);
    if (!author) {
      throw new NotFoundException(`Author with id ${id} not found`);
    }
    author.books = await this.booksRepository.findByAuthor(author.name);
    return author;
  }

  create(dto: CreateAuthorDto): Promise<AuthorEntity> {
    return this.authorsRepository.create({ ...dto });
  }

  async findBooks(id: number): Promise<BookEntity[]> {
    const author = await this.authorsRepository.findById(id);
    if (!author) {
      throw new NotFoundException(`Author with id ${id} not found`);
    }
    return this.booksRepository.findByAuthor(author.name);
  }
}
