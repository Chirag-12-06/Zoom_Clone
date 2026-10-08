from pydantic import BaseModel, ConfigDict


class UserOut(BaseModel):
    # from_attributes lets Pydantic read fields straight off a SQLAlchemy object
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
