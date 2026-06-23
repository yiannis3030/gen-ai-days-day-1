import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { AuthorEntity } from './author.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { BookEntity } from '../books/book.entity';

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Get()
  findAll(): Promise<AuthorEntity[]> {
    return this.authorsService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAuthorDto): Promise<AuthorEntity> {
    return this.authorsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AuthorEntity> {
    return this.authorsService.findOne(id);
  }

  @Get(':id/books')
  findBooks(@Param('id', ParseIntPipe) id: number): Promise<BookEntity[]> {
    return this.authorsService.findBooks(id);
  }
}

