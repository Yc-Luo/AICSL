
from pydantic import BaseModel, TypeAdapter
import json

class MyModel(BaseModel):
    data: bytes

model = MyModel(data=b"\xb2\x00\x01")
print("Model created")

# Simulation of FastAPI's response serialization
try:
    # mode='json' should base64 encode
    json_data = model.model_dump(mode='json')
    print("JSON data:", json_data)
except Exception as e:
    print("Error in model_dump(mode='json'):", e)

try:
    # This might be what's failing in the traceback
    # self.serializer.to_python(mode='json')
    adapter = TypeAdapter(MyModel)
    res = adapter.dump_python(model, mode='json')
    print("TypeAdapter dump_python:", res)
except Exception as e:
    print("Error in adapter.dump_python:", e)
