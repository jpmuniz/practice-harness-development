
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Commercial, Prisma } from '../generated/prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async post(
    commercialWhereUniqueInput: Prisma.CommercialWhereUniqueInput,
  ): Promise<Commercial | null> {
    return this.prisma.commercial.findUnique({
      where: commercialWhereUniqueInput,
    });
  }

  async commercial(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CommercialWhereUniqueInput;
    where?: Prisma.CommercialWhereInput;
    orderBy?: Prisma.CommercialOrderByWithRelationInput;
  }): Promise<Commercial[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.commercial.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createCommercial(data: Prisma.CommercialCreateInput): Promise<Commercial> {
    return this.prisma.commercial.create({
      data,
    });
  }

  async updateCommercial(params: {
    where: Prisma.CommercialWhereUniqueInput;
    data: Prisma.CommercialUpdateInput;
  }): Promise<Commercial> {
    const { data, where } = params;
    return this.prisma.commercial.update({
      data,
      where,
    });
  }

  async deleteCommercial(where: Prisma.CommercialWhereUniqueInput): Promise<Commercial> {
    return this.prisma.commercial.delete({
      where,
    });
  }
}
