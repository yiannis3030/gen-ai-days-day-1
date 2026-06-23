import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthorEntity } from './author.entity';

@Injectable()
export class AuthorsRepository {
  constructor(
    @InjectRepository(AuthorEntity)
    private readonly repository: Repository<AuthorEntity>,
  ) {}

  findAll(): Promise<AuthorEntity[]> {
    return this.repository.find();
  }

  findById(id: number): Promise<AuthorEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  create(data: Partial<AuthorEntity>): Promise<AuthorEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }
}

