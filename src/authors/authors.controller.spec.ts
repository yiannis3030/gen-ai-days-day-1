import { Test, TestingModule } from '@nestjs/testing';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { AuthorEntity } from './author.entity';
import { CreateAuthorDto } from './dto/create-author.dto';

describe('AuthorsController', () => {
  let controller: AuthorsController;
  let service: jest.Mocked<AuthorsService>;

  const author = { id: 1, name: 'A', books: [] } as AuthorEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorsController],
      providers: [
        {
          provide: AuthorsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([author]),
            findOne: jest.fn().mockResolvedValue(author),
            create: jest.fn().mockResolvedValue(author),
            findBooks: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthorsController);
    service = module.get(AuthorsService);
  });

  it('lists authors', async () => {
    await expect(controller.findAll()).resolves.toEqual([author]);
  });

  it('creates an author', async () => {
    const dto = { name: 'A' } as CreateAuthorDto;
    await expect(controller.create(dto)).resolves.toEqual(author);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('gets an author', async () => {
    await expect(controller.findOne(1)).resolves.toEqual(author);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('gets author books', async () => {
    await expect(controller.findBooks(1)).resolves.toEqual([]);
    expect(service.findBooks).toHaveBeenCalledWith(1);
  });
});

