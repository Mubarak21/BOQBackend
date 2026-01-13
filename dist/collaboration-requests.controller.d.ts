import { Repository } from "typeorm";
import { CollaborationRequest } from "./entities/collaboration-request.entity";
import { ProjectsService } from "./projects/projects.service";
export declare class CollaborationRequestsController {
    private readonly collaborationRequestRepository;
    private readonly projectsService;
    constructor(collaborationRequestRepository: Repository<CollaborationRequest>, projectsService: ProjectsService);
    getMyRequests(req: any): Promise<CollaborationRequest[]>;
    acceptRequest(id: string, req: any, token?: string): Promise<{
        message: string;
    }>;
    rejectRequest(id: string, req: any): Promise<{
        message: string;
    }>;
}
