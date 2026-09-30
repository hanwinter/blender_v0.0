import unittest

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.database.initialize import initialize_database
from app.models.model import ModelPart
from app.services.models import get_model, list_models


class ModelDatabaseTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite://")
        initialize_database(self.engine)

    def tearDown(self) -> None:
        self.engine.dispose()

    def test_model_and_parts_are_read_from_database(self) -> None:
        with Session(self.engine) as session:
            self.assertEqual(list_models(session)[0].part_count, 6)
            self.assertEqual(len(list_models(session)), 2)
            detail = get_model(session, "demo_cube")
            self.assertIsNotNone(detail)
            assert detail is not None
            self.assertEqual(len(detail.parts), 6)
            self.assertEqual(detail.version, "1.0.0")
            self.assertEqual(detail.parts[0].id, "face_front")
            self.assertEqual(detail.parts[-1].id, "face_bottom")
            self.assertIsNone(get_model(session, "missing"))

    def test_repeated_initialization_preserves_persisted_metadata(self) -> None:
        with Session(self.engine) as session, session.begin():
            part = session.get(ModelPart, ("demo_cube", "face_front"))
            assert part is not None
            part.description = "数据库中的描述"
        initialize_database(self.engine)
        with Session(self.engine) as session:
            detail = get_model(session, "demo_cube")
            assert detail is not None
            self.assertEqual(detail.parts[0].description, "数据库中的描述")
            self.assertEqual(len(detail.parts), 6)

    def test_existing_sqlite_schema_gains_version_without_losing_data(self) -> None:
        legacy = create_engine('sqlite://')
        try:
            with legacy.begin() as connection:
                connection.execute(text('CREATE TABLE model_assets (id VARCHAR(128) PRIMARY KEY, name VARCHAR(128) NOT NULL, description TEXT NOT NULL, model_url VARCHAR(2048))'))
                connection.execute(text("INSERT INTO model_assets (id, name, description) VALUES ('demo_cube', 'saved name', 'saved description')"))
            initialize_database(legacy)
            initialize_database(legacy)
            with Session(legacy) as session:
                model = get_model(session, 'demo_cube')
                assert model is not None
                self.assertEqual(model.version, '1.0.0')
                self.assertEqual(model.name, 'saved name')
                self.assertEqual(model.description, 'saved description')
                self.assertEqual(len(model.parts), 0)
                self.assertEqual(get_model(session, 'interaction_test').part_count, 3)
        finally:
            legacy.dispose()


if __name__ == "__main__":
    unittest.main()
