/**
 * ARCHIVO DE REFERENCIA - NO MODIFICAR
 *
 * Este archivo muestra el patron completo de un Use Case en el proyecto.
 * Copilot y los participantes lo usan como ejemplo para crear use cases nuevos.
 * NO es codigo ejecutable del feature, es solo una referencia del patron.
 */

import { Injectable, Inject } from 'injection-js';
import { AbstractLogger } from '../core/logger/logger';
import { ConverterFunction } from '../core/middlewares/converter/converter-function';

// -- 1. Port: interface + InjectionToken --

import { InjectionToken } from 'injection-js';

export interface ReadItemsPort {
  findByUserId(userId: string): Promise<any[]>;
  findById(id: string): Promise<any | null>;
}

export const IReadItemsPortProvider = new InjectionToken<ReadItemsPort>(
  'IReadItemsPortProvider',
);

// -- 2. Use Case: @Injectable + execute() + logging --

@Injectable()
export class ListItemsUseCase {
  constructor(
    private readonly logger: AbstractLogger,
    @Inject(IReadItemsPortProvider)
    private readonly readPort: ReadItemsPort,
    @Inject('IItemViewModelConverterProvider')
    private readonly converter: ConverterFunction<any, any>,
  ) {}

  async execute(userId: string): Promise<any[]> {
    this.logger.info('Event started: Listing items', { userId });

    const items = await this.readPort.findByUserId(userId);
    const viewModels = items.map((item) => this.converter.apply(item));

    this.logger.info('Event finished: Items listed', {
      userId,
      count: viewModels.length,
    });

    return viewModels;
  }
}
