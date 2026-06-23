import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BookEntity } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';

describe('BooksController', () => {
  let controller: BooksController;
  let service: jest.Mocked<BooksService>;

  const book = {
    id: 1,
    title: 'T',
    authors: ['A'],
    isbn: 'i',
    publishedYear: 2020,
  } as BookEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([book]),
            findOne: jest.fn().mockResolvedValue(book),
            create: jest.fn().mockResolvedValue(book),
            update: jest.fn().mockResolvedValue(book),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get(BooksController);
    service = module.get(BooksService);
  });

  it('lists books', async () => {
    await expect(controller.findAll({})).resolves.toEqual([book]);
    expect(service.findAll).toHaveBeenCalledWith({});
  });

  it('creates a book', async () => {
    const dto = {} as CreateBookDto;
    await expect(controller.create(dto)).resolves.toEqual(book);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('gets a book', async () => {
    await expect(controller.findOne(1)).resolves.toEqual(book);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('updates a book', async () => {
    const dto = {} as CreateBookDto;
    await expect(controller.update(1, dto)).resolves.toEqual(book);
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('deletes a book', async () => {
    await expect(controller.remove(1)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});

