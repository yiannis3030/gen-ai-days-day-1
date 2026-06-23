import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorEntity } from './author.entity';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { AuthorsRepository } from './authors.repository';
import { BooksModule } from '../books/books.module';
import { BookEntity } from '../books/book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuthorEntity, BookEntity]), BooksModule],
  controllers: [AuthorsController],
  providers: [AuthorsService, AuthorsRepository],
})
export class AuthorsModule {}

