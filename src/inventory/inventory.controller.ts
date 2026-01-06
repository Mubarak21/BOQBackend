import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from "@nestjs/common";
import {
  FileInterceptor,
  FilesInterceptor,
  FileFieldsInterceptor,
} from "@nestjs/platform-express";
import { InventoryService } from "./inventory.service";
import { CreateInventoryDto } from "./dto/create-inventory.dto";
import { UpdateInventoryDto } from "./dto/update-inventory.dto";
import { InventoryQueryDto } from "./dto/inventory-query.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../entities/user.entity";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";

@Controller("inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.USER)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Upload and process inventory document
   */
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadInventoryDocument(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: RequestWithUser
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
      "application/pdf", // .pdf
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/msword", // .doc
      "text/plain", // .txt
      "application/json", // .json
      "application/xml", // .xml
      "text/xml", // .xml (alternative)
    ];

    const allowedExtensions = [
      ".xlsx",
      ".xls",
      ".csv",
      ".pdf",
      ".docx",
      ".doc",
      ".txt",
      ".json",
      ".xml",
    ];
    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf("."));

    if (
      !allowedTypes.includes(file.mimetype) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      throw new BadRequestException(
        "Invalid file type. Please upload Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf), Word (.doc, .docx), Text (.txt), JSON (.json), or XML (.xml) files only."
      );
    }

    // Max file size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException(
        "File size too large. Maximum allowed size is 10MB."
      );
    }

    return this.inventoryService.processInventoryDocument(file, req.user.id);
  }

  /**
   * Create a new inventory item manually with picture and optional invoice
   */
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "picture", maxCount: 1 },
        { name: "invoice", maxCount: 1 },
      ],
      {
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
      }
    )
  )
  async create(
    @UploadedFiles()
    files: {
      picture?: Express.Multer.File[];
      invoice?: Express.Multer.File[];
    },
    @Body() createInventoryDto: CreateInventoryDto,
    @Request() req: RequestWithUser
  ) {
    // Validate picture is provided (required)
    const pictureFile = files?.picture?.[0];
    if (!pictureFile) {
      throw new BadRequestException("Picture evidence is required");
    }

    // Validate picture is an image
    if (!pictureFile.mimetype.startsWith("image/")) {
      throw new BadRequestException(
        "Picture file must be an image (JPEG, PNG, etc.)"
      );
    }

    // Validate invoice if provided (optional)
    const invoiceFile = files?.invoice?.[0];
    if (invoiceFile) {
      const allowedInvoiceTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      if (!allowedInvoiceTypes.includes(invoiceFile.mimetype)) {
        throw new BadRequestException(
          "Invoice must be a PDF, image (JPEG/PNG), or Word document"
        );
      }
    }

    return this.inventoryService.create(
      createInventoryDto,
      req.user.id,
      pictureFile,
      invoiceFile
    );
  }

  /**
   * Get all inventory items with filtering and pagination
   */
  @Get()
  async findAll(@Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  /**
   * Get inventory statistics
   */
  @Get("stats")
  async getStats() {
    return this.inventoryService.getStats();
  }

  /**
   * Get low stock items
   */
  @Get("low-stock")
  async getLowStockItems(@Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll({ ...query, low_stock: true });
  }

  /**
   * Search inventory items
   */
  @Get("search")
  async searchInventory(
    @Query("q") searchQuery: string,
    @Query() query: InventoryQueryDto
  ) {
    return this.inventoryService.findAll({ ...query, search: searchQuery });
  }

  /**
   * Get a single inventory item
   */
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.inventoryService.findOne(id);
  }

  /**
   * Update an inventory item
   */
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @Request() req: RequestWithUser
  ) {
    return this.inventoryService.update(id, updateInventoryDto, req.user.id);
  }

  /**
   * Delete an inventory item
   */
  @Delete(":id")
  async remove(@Param("id") id: string, @Request() req: RequestWithUser) {
    await this.inventoryService.remove(id, req.user.id);
    return { message: "Inventory item deleted successfully" };
  }

  /**
   * Bulk update inventory quantities (for stock management)
   */
  @Patch("bulk/quantities")
  async bulkUpdateQuantities(
    @Body() updates: Array<{ id: string; quantity_available: number }>,
    @Request() req: RequestWithUser
  ) {
    const results = [];
    for (const update of updates) {
      try {
        const item = await this.inventoryService.update(
          update.id,
          { quantity_available: update.quantity_available },
          req.user.id
        );
        results.push({ id: update.id, success: true, item });
      } catch (error) {
        results.push({ id: update.id, success: false, error: error.message });
      }
    }
    return { results };
  }

  /**
   * Export inventory data (CSV format)
   */
  @Get("export/csv")
  async exportToCsv(@Query() query: InventoryQueryDto) {
    const { items } = await this.inventoryService.findAll({
      ...query,
      limit: 10000,
    });

    const csvHeader =
      "Name,Description,Unit,Unit Price,Category,Brand,Model,Supplier,Quantity Available,Minimum Stock,Active,Created At\n";
    const csvRows = items
      .map((item) =>
        [
          item.name,
          item.description || "",
          item.unit,
          item.unit_price,
          item.category,
          item.brand || "",
          item.model || "",
          item.supplier || "",
          item.quantity_available,
          item.minimum_stock,
          item.is_active,
          item.created_at.toISOString(),
        ]
          .map((field) => `"${field}"`)
          .join(",")
      )
      .join("\n");

    return {
      filename: `inventory_export_${new Date().toISOString().split("T")[0]}.csv`,
      content: csvHeader + csvRows,
      contentType: "text/csv",
    };
  }
}
