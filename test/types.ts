export interface User {
    id: string;
    creations: Array<Media>;
    collection: Array<Media>;
    authorizedUsers: Array<User>;
}

export interface UsersQueryResponse {
    users: Array<User>;
}

export interface UserQueryResponse {
    user: User;
}

export interface Media {
    id: string;
    contentHash: string;
    contentURI: string;
    metadataHash: string;
    metadataURI: string;
    creator: Media,
    owner: Media,
    prevOwner: Media,
    approved: User,
}

export interface MediaQueryResponse{
    media: Media;
}

export interface MediasQueryResponse {
    medias: Array<Media>;
}